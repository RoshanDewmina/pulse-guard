package provider

import (
	"context"
	"fmt"

	"github.com/hashicorp/terraform-plugin-framework/path"
	"github.com/hashicorp/terraform-plugin-framework/resource"
	"github.com/hashicorp/terraform-plugin-framework/resource/schema"
	"github.com/hashicorp/terraform-plugin-framework/resource/schema/int64default"
	"github.com/hashicorp/terraform-plugin-framework/resource/schema/planmodifier"
	"github.com/hashicorp/terraform-plugin-framework/resource/schema/stringdefault"
	"github.com/hashicorp/terraform-plugin-framework/resource/schema/stringplanmodifier"
	"github.com/hashicorp/terraform-plugin-framework/types"
	"github.com/saturn/terraform-provider-saturn/internal/client"
)

// Ensure provider defined types fully satisfy framework interfaces.
var _ resource.Resource = &MonitorResource{}
var _ resource.ResourceWithImportState = &MonitorResource{}

func NewMonitorResource() resource.Resource {
	return &MonitorResource{}
}

// MonitorResource defines the resource implementation.
type MonitorResource struct {
	client *client.Client
}

// MonitorResourceModel describes the resource data model.
type MonitorResourceModel struct {
	ID           types.String `tfsdk:"id"`
	Name         types.String `tfsdk:"name"`
	ScheduleType types.String `tfsdk:"schedule_type"`
	IntervalSec  types.Int64  `tfsdk:"interval_sec"`
	CronExpr     types.String `tfsdk:"cron_expr"`
	Timezone     types.String `tfsdk:"timezone"`
	GraceSec     types.Int64  `tfsdk:"grace_sec"`
	Tags         types.List   `tfsdk:"tags"`
}

func (r *MonitorResource) Metadata(ctx context.Context, req resource.MetadataRequest, resp *resource.MetadataResponse) {
	resp.TypeName = req.ProviderTypeName + "_monitor"
}

func (r *MonitorResource) Schema(ctx context.Context, req resource.SchemaRequest, resp *resource.SchemaResponse) {
	resp.Schema = schema.Schema{
		MarkdownDescription: "Monitor resource for tracking scheduled jobs.",

		Attributes: map[string]schema.Attribute{
			"id": schema.StringAttribute{
				Computed:            true,
				MarkdownDescription: "Monitor identifier",
				PlanModifiers: []planmodifier.String{
					stringplanmodifier.UseStateForUnknown(),
				},
			},
			"name": schema.StringAttribute{
				MarkdownDescription: "Monitor name",
				Required:            true,
			},
			"schedule_type": schema.StringAttribute{
				MarkdownDescription: "Schedule type: INTERVAL or CRON",
				Required:            true,
			},
			"interval_sec": schema.Int64Attribute{
				MarkdownDescription: "Interval in seconds (required for INTERVAL schedule type)",
				Optional:            true,
			},
			"cron_expr": schema.StringAttribute{
				MarkdownDescription: "Cron expression (required for CRON schedule type)",
				Optional:            true,
			},
			"timezone": schema.StringAttribute{
				MarkdownDescription: "Timezone for cron schedules (default: UTC)",
				Optional:            true,
				Computed:            true,
				Default:             stringdefault.StaticString("UTC"),
			},
			"grace_sec": schema.Int64Attribute{
				MarkdownDescription: "Grace period in seconds before marking as missed",
				Optional:            true,
				Computed:            true,
				Default:             int64default.StaticInt64(300),
			},
			"tags": schema.ListAttribute{
				MarkdownDescription: "Tags for organizing monitors",
				Optional:            true,
				ElementType:         types.StringType,
			},
		},
	}
}

func (r *MonitorResource) Configure(ctx context.Context, req resource.ConfigureRequest, resp *resource.ConfigureResponse) {
	if req.ProviderData == nil {
		return
	}

	client, ok := req.ProviderData.(*client.Client)

	if !ok {
		resp.Diagnostics.AddError(
			"Unexpected Resource Configure Type",
			fmt.Sprintf("Expected *client.Client, got: %T. Please report this issue to the provider developers.", req.ProviderData),
		)

		return
	}

	r.client = client
}

func (r *MonitorResource) Create(ctx context.Context, req resource.CreateRequest, resp *resource.CreateResponse) {
	var data MonitorResourceModel

	resp.Diagnostics.Append(req.Plan.Get(ctx, &data)...)

	if resp.Diagnostics.HasError() {
		return
	}

	monitor := &client.Monitor{
		Name:         data.Name.ValueString(),
		ScheduleType: data.ScheduleType.ValueString(),
		GraceSec:     int(data.GraceSec.ValueInt64()),
	}

	if !data.IntervalSec.IsNull() {
		monitor.IntervalSec = int(data.IntervalSec.ValueInt64())
	}

	if !data.CronExpr.IsNull() {
		monitor.CronExpr = data.CronExpr.ValueString()
	}

	if !data.Timezone.IsNull() {
		monitor.Timezone = data.Timezone.ValueString()
	}

	created, err := r.client.CreateMonitor(monitor)
	if err != nil {
		resp.Diagnostics.AddError("Client Error", fmt.Sprintf("Unable to create monitor, got error: %s", err))
		return
	}

	data.ID = types.StringValue(created.ID)

	resp.Diagnostics.Append(resp.State.Set(ctx, &data)...)
}

func (r *MonitorResource) Read(ctx context.Context, req resource.ReadRequest, resp *resource.ReadResponse) {
	var data MonitorResourceModel

	resp.Diagnostics.Append(req.State.Get(ctx, &data)...)

	if resp.Diagnostics.HasError() {
		return
	}

	monitor, err := r.client.GetMonitor(data.ID.ValueString())
	if err != nil {
		resp.Diagnostics.AddError("Client Error", fmt.Sprintf("Unable to read monitor, got error: %s", err))
		return
	}

	data.Name = types.StringValue(monitor.Name)
	data.ScheduleType = types.StringValue(monitor.ScheduleType)
	data.GraceSec = types.Int64Value(int64(monitor.GraceSec))

	if monitor.IntervalSec > 0 {
		data.IntervalSec = types.Int64Value(int64(monitor.IntervalSec))
	}

	if monitor.CronExpr != "" {
		data.CronExpr = types.StringValue(monitor.CronExpr)
	}

	if monitor.Timezone != "" {
		data.Timezone = types.StringValue(monitor.Timezone)
	}

	resp.Diagnostics.Append(resp.State.Set(ctx, &data)...)
}

func (r *MonitorResource) Update(ctx context.Context, req resource.UpdateRequest, resp *resource.UpdateResponse) {
	var data MonitorResourceModel

	resp.Diagnostics.Append(req.Plan.Get(ctx, &data)...)

	if resp.Diagnostics.HasError() {
		return
	}

	monitor := &client.Monitor{
		Name:         data.Name.ValueString(),
		ScheduleType: data.ScheduleType.ValueString(),
		GraceSec:     int(data.GraceSec.ValueInt64()),
	}

	if !data.IntervalSec.IsNull() {
		monitor.IntervalSec = int(data.IntervalSec.ValueInt64())
	}

	if !data.CronExpr.IsNull() {
		monitor.CronExpr = data.CronExpr.ValueString()
	}

	if !data.Timezone.IsNull() {
		monitor.Timezone = data.Timezone.ValueString()
	}

	updated, err := r.client.UpdateMonitor(data.ID.ValueString(), monitor)
	if err != nil {
		resp.Diagnostics.AddError("Client Error", fmt.Sprintf("Unable to update monitor, got error: %s", err))
		return
	}

	data.Name = types.StringValue(updated.Name)

	resp.Diagnostics.Append(resp.State.Set(ctx, &data)...)
}

func (r *MonitorResource) Delete(ctx context.Context, req resource.DeleteRequest, resp *resource.DeleteResponse) {
	var data MonitorResourceModel

	resp.Diagnostics.Append(req.State.Get(ctx, &data)...)

	if resp.Diagnostics.HasError() {
		return
	}

	err := r.client.DeleteMonitor(data.ID.ValueString())
	if err != nil {
		resp.Diagnostics.AddError("Client Error", fmt.Sprintf("Unable to delete monitor, got error: %s", err))
		return
	}
}

func (r *MonitorResource) ImportState(ctx context.Context, req resource.ImportStateRequest, resp *resource.ImportStateResponse) {
	resource.ImportStatePassthroughID(ctx, path.Root("id"), req, resp)
}

